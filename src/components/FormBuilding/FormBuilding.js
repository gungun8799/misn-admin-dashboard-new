import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import styles from './FormBuilding.module.css';
import Sidebar from '../Sidebar/Sidebar';

const FormBuilding = () => {
  const { program, formIndex } = useParams();
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Screening');
  const [questions, setQuestions] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForm = async () => {
      if (program === 'MISN_form') {
        const misnDocRef = doc(db, 'FormsScreening', 'MISN_form');
        const misnDoc = await getDoc(misnDocRef);
        if (misnDoc.exists()) {
          const formToEdit = misnDoc.data();
          setFormName('MISN Screening');
          setFormType('Screening');
          setQuestions(formToEdit.form_screening_data.map(item => ({ question: item.Question, prompt: item.Prompt })));
        }
      } else if (formIndex !== undefined) {
        const programDocRef = doc(db, 'ProgramForms', program);
        const programDoc = await getDoc(programDocRef);
        if (programDoc.exists()) {
          const forms = programDoc.data().forms;
          const formToEdit = forms[parseInt(formIndex, 10)];
          setFormName(formToEdit.name || '');
          setFormType(formToEdit.type || 'Screening');
          setQuestions(formToEdit.questions || []);
        }
      }
    };

    fetchForm();
  }, [program, formIndex]);

  const handleQuestionChange = (index, event) => {
    const values = [...questions];
    values[index].question = event.target.value;
    setQuestions(values);
  };

  const handlePromptChange = (index, event) => {
    const values = [...questions];
    values[index].prompt = event.target.value;
    setQuestions(values);
  };

  const handleAddMultipleChoiceQuestion = () => {
    setQuestions([...questions, { question: '', prompt: '', choices: [''], type: 'multiple-choice' }]);
  };

  const handleAddShortAnswerQuestion = () => {
    setQuestions([...questions, { question: '', prompt: '', choices: [], type: 'short-answer' }]);
  };

  const handleRemoveQuestion = (index) => {
    const values = [...questions];
    values.splice(index, 1);
    setQuestions(values);
  };

  const handleFormSubmit = async () => {
    if (!formName) {
      setUploadError('Please enter a form name.');
      return;
    }

    try {
      if (program === 'MISN_form') {
        const misnDocRef = doc(db, 'FormsScreening', 'MISN_form');
        const newForm = {
          form_screening_data: questions.map(q => ({
            Question: q.question,
            Prompt: q.prompt,
            Answer: ''
          }))
        };
        await updateDoc(misnDocRef, newForm);
      } else {
        const programDocRef = doc(db, 'ProgramForms', program);
        const programDoc = await getDoc(programDocRef);
        let forms = [];
        if (programDoc.exists()) {
          forms = programDoc.data().forms || [];
        }

        const newForm = {
          name: formName,
          type: formType,
          questions: questions.map(q => ({
            Question: q.question,
            Prompt: q.prompt,
            Answer: ''
          }))
        };

        if (formIndex !== undefined) {
          forms[parseInt(formIndex, 10)] = newForm;
          await updateDoc(programDocRef, { forms });
        } else {
          forms.push(newForm);
          await setDoc(programDocRef, { forms });
        }
      }

      setUploadSuccess('Form created successfully.');
      setFormName('');
      setFormType('Screening');
      setQuestions([]);
      navigate('/Form');
    } catch (error) {
      console.error('Error creating form:', error);
      setUploadError('Failed to create form. Please try again.');
    }
  };

  return (
    <div className={styles.formBuildingPage}>
      <Sidebar />
      <div className={styles.formBuildingContainer}>
        <button className={styles.backButton} onClick={() => navigate('/Form')}>Back</button>
        <h1>{formIndex !== undefined ? 'Edit' : 'Create'} Form for {program === 'MISN_form' ? 'MiSN Screening' : program}</h1>
        <div className={styles.formGroup}>
          <label htmlFor="formName">Form Name</label>
          <input
            type="text"
            id="formName"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter the form name"
            disabled={program === 'MISN_form'} // Disable editing the name for MiSN Screening form
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="formType">Form Type</label>
          <select id="formType" value={formType} onChange={(e) => setFormType(e.target.value)} disabled>
            <option value="Screening">Screening</option>
            <option value="Assessment">Assessment</option>
          </select>
        </div>

        {questions.map((question, index) => (
          <div key={index} className={styles.questionGroup}>
            <div className={styles.questionInputWrapper}>
              <label>Question</label>
              <input
                type="text"
                name="question"
                value={question.question}
                onChange={(e) => handleQuestionChange(index, e)}
                placeholder="Enter the question"
              />
              <label>Expected Answer</label>
              <input
                type="text"
                name="prompt"
                value={question.prompt}
                onChange={(e) => handlePromptChange(index, e)}
                placeholder="Enter the prompt"
              />
              <button
                type="button"
                className={styles.removeQuestionButton}
                onClick={() => handleRemoveQuestion(index)}
              >
                X
              </button>
            </div>
          </div>
        ))}
        <div className={styles.addQuestionContainer}>
          <button type="button" className={styles.addQuestionButton}>+</button>
          <div className={styles.addQuestionDropdown}>
            <button type="button" onClick={handleAddMultipleChoiceQuestion}>Multiple Choice</button>
            <button type="button" onClick={handleAddShortAnswerQuestion}>Short Answer</button>
          </div>
        </div>
        <button type="button" className={styles.submitButton} onClick={handleFormSubmit}>{formIndex !== undefined ? 'Update' : 'Create'} Form</button>

        {uploadError && <p className={styles.errorMessage}>{uploadError}</p>}
        {uploadSuccess && <p className={styles.successMessage}>{uploadSuccess}</p>}
      </div>
    </div>
  );
};

export default FormBuilding;
